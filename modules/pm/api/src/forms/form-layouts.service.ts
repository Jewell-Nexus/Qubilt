import { Injectable } from '@nestjs/common';
import { SettingsService } from '@kernel/settings/settings.service';
import { FormGroupDto, FormFieldType } from './dto/save-form-layout.dto';

const PM_MODULE_ID = '@qubilt/pm';

export interface FormLayout {
  typeId: string;
  groups: FormGroupDto[];
}

// Default built-in fields when no layout is configured
const DEFAULT_GROUPS: FormGroupDto[] = [
  {
    id: 'details',
    label: 'Details',
    fields: [
      { id: 'subject', label: 'Subject', fieldType: FormFieldType.BUILTIN, builtinKey: 'subject', required: true, position: 0, visible: true },
      { id: 'type', label: 'Type', fieldType: FormFieldType.BUILTIN, builtinKey: 'typeId', required: true, position: 1, visible: true },
      { id: 'status', label: 'Status', fieldType: FormFieldType.BUILTIN, builtinKey: 'statusId', required: true, position: 2, visible: true },
      { id: 'priority', label: 'Priority', fieldType: FormFieldType.BUILTIN, builtinKey: 'priorityId', required: false, position: 3, visible: true },
      { id: 'assignee', label: 'Assignee', fieldType: FormFieldType.BUILTIN, builtinKey: 'assigneeId', required: false, position: 4, visible: true },
      { id: 'description', label: 'Description', fieldType: FormFieldType.BUILTIN, builtinKey: 'description', required: false, position: 5, visible: true },
    ],
  },
  {
    id: 'dates',
    label: 'Dates & Effort',
    fields: [
      { id: 'startDate', label: 'Start date', fieldType: FormFieldType.BUILTIN, builtinKey: 'startDate', required: false, position: 0, visible: true },
      { id: 'dueDate', label: 'Due date', fieldType: FormFieldType.BUILTIN, builtinKey: 'dueDate', required: false, position: 1, visible: true },
      { id: 'estimatedHours', label: 'Estimated hours', fieldType: FormFieldType.BUILTIN, builtinKey: 'estimatedHours', required: false, position: 2, visible: true },
      { id: 'percentDone', label: 'Progress', fieldType: FormFieldType.BUILTIN, builtinKey: 'percentDone', required: false, position: 3, visible: true },
      { id: 'storyPoints', label: 'Story points', fieldType: FormFieldType.BUILTIN, builtinKey: 'storyPoints', required: false, position: 4, visible: true },
    ],
  },
  {
    id: 'categorization',
    label: 'Categorization',
    fields: [
      { id: 'version', label: 'Version', fieldType: FormFieldType.BUILTIN, builtinKey: 'versionId', required: false, position: 0, visible: true },
      { id: 'category', label: 'Category', fieldType: FormFieldType.BUILTIN, builtinKey: 'categoryId', required: false, position: 1, visible: true },
      { id: 'parent', label: 'Parent', fieldType: FormFieldType.BUILTIN, builtinKey: 'parentId', required: false, position: 2, visible: true },
    ],
  },
];

@Injectable()
export class FormLayoutsService {
  constructor(private settings: SettingsService) {}

  async getLayout(workspaceId: string, typeId: string): Promise<FormLayout> {
    const key = `pm.form.layout.${typeId}`;
    const stored = await this.settings.get<FormGroupDto[]>(
      workspaceId,
      PM_MODULE_ID,
      key,
    );

    return {
      typeId,
      groups: stored ?? DEFAULT_GROUPS,
    };
  }

  async saveLayout(
    workspaceId: string,
    typeId: string,
    groups: FormGroupDto[],
  ): Promise<void> {
    const key = `pm.form.layout.${typeId}`;
    await this.settings.set(workspaceId, PM_MODULE_ID, key, groups);
  }
}
