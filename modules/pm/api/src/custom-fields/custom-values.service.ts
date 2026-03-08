import { Injectable, BadRequestException } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CustomValueInput } from './dto/set-custom-values.dto';

// Validation functions per field format
const FORMAT_VALIDATORS: Record<string, (v: string) => boolean> = {
  INTEGER: (v) => /^-?\d+$/.test(v),
  FLOAT: (v) => /^-?\d+(\.\d+)?$/.test(v),
  BOOL: (v) => v === 'true' || v === 'false' || v === '0' || v === '1',
  DATE: (v) => !isNaN(Date.parse(v)) && /^\d{4}-\d{2}-\d{2}$/.test(v),
  DATETIME: (v) => !isNaN(Date.parse(v)),
};

@Injectable()
export class CustomValuesService {
  constructor(private prisma: PmPrismaService) {}

  async setValues(
    workPackageId: string,
    values: CustomValueInput[],
    userId: string,
  ) {
    if (values.length === 0) return;

    // Fetch the fields for validation
    const fieldIds = values.map((v) => v.customFieldId);
    const fields = await this.prisma.pmCustomField.findMany({
      where: { id: { in: fieldIds } },
    });

    const fieldMap = new Map(fields.map((f) => [f.id, f]));

    // Fetch existing values to detect changes for journal
    const existingValues = await this.prisma.pmCustomValue.findMany({
      where: { workPackageId, customFieldId: { in: fieldIds } },
    });
    const existingMap = new Map(
      existingValues.map((v) => [v.customFieldId, v.value]),
    );

    // Validate and upsert
    const changes: { property: string; oldValue: string | null; newValue: string }[] = [];

    for (const input of values) {
      const field = fieldMap.get(input.customFieldId);
      if (!field) {
        throw new BadRequestException(
          `Custom field ${input.customFieldId} not found`,
        );
      }

      // Type validation
      const validator = FORMAT_VALIDATORS[field.fieldFormat];
      if (validator && !validator(input.value)) {
        throw new BadRequestException(
          `Invalid value for field "${field.name}" (${field.fieldFormat}): ${input.value}`,
        );
      }

      // List validation
      if (
        (field.fieldFormat === 'LIST' || field.fieldFormat === 'MULTI_LIST') &&
        field.possibleValues
      ) {
        const allowed = field.possibleValues as string[];
        if (field.fieldFormat === 'LIST' && !allowed.includes(input.value)) {
          throw new BadRequestException(
            `Value "${input.value}" not in allowed list for field "${field.name}"`,
          );
        }
        if (field.fieldFormat === 'MULTI_LIST') {
          const selected = input.value.split(',').map((s) => s.trim());
          for (const s of selected) {
            if (!allowed.includes(s)) {
              throw new BadRequestException(
                `Value "${s}" not in allowed list for field "${field.name}"`,
              );
            }
          }
        }
      }

      // Track changes for journal
      const oldVal = existingMap.get(input.customFieldId) ?? null;
      if (oldVal !== input.value) {
        changes.push({
          property: `cf_${field.name}`,
          oldValue: oldVal,
          newValue: input.value,
        });
      }
    }

    // Upsert all values in a transaction
    await this.prisma.$transaction(
      values.map((v) =>
        this.prisma.pmCustomValue.upsert({
          where: {
            workPackageId_customFieldId: {
              workPackageId,
              customFieldId: v.customFieldId,
            },
          },
          update: { value: v.value },
          create: {
            workPackageId,
            customFieldId: v.customFieldId,
            value: v.value,
          },
        }),
      ),
    );

    // Write journal entry for changed custom values
    if (changes.length > 0) {
      await this.prisma.pmJournal.create({
        data: {
          workPackageId,
          userId,
          details: { create: changes },
        },
      });
    }
  }

  async getValues(workPackageId: string) {
    const values = await this.prisma.pmCustomValue.findMany({
      where: { workPackageId },
      include: { customField: true },
    });

    return values.map((v) => ({
      field: v.customField,
      value: v.value,
    }));
  }
}
