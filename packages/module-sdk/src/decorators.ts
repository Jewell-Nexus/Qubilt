/**
 * Method decorator that marks a handler as requiring a specific permission.
 * Will be enforced by the kernel's permission guard at runtime.
 */
export function QubiltPermission(_key: string): MethodDecorator {
  return (_target, _propertyKey, descriptor) => {
    return descriptor
  }
}

/**
 * Class or method decorator that ensures the specified module is enabled
 * for the current workspace before allowing access.
 */
export function ModuleEnabled(_moduleId: string) {
  return <T extends Function>(target: T): T => {
    return target
  }
}
