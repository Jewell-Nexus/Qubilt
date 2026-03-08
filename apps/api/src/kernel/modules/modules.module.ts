import { Module } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleLifecycleService } from './module-lifecycle.service';
import { ModuleEnabledGuard } from './module-enabled.guard';
import { ModulesController } from './modules.controller';

@Module({
  controllers: [ModulesController],
  providers: [ModuleRegistryService, ModuleLifecycleService, ModuleEnabledGuard],
  exports: [ModuleRegistryService, ModuleLifecycleService, ModuleEnabledGuard],
})
export class ModulesModule {}
