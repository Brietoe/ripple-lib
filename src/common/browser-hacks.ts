/* eslint-disable @typescript-eslint/no-explicit-any -- These functions are hacky */
/* eslint-disable no-proto -- These functions are hacky */
/* eslint-disable no-param-reassign -- These functions are hacky */

/**
 * Object.setPrototypeOf not supported on Internet Explorer 9.
 *
 * @param object - Object to set prototype.
 * @param prototype - To set.
 */
function setPrototypeOf(
  object: {__proto__: any},
  prototype: Record<string, any>
): void {
  if (Object.setPrototypeOf === undefined) {
    object.__proto__ = prototype
  } else {
    Object.setPrototypeOf(object, prototype)
  }
}

/**
 * Get name of constructor.
 *
 * @param object - Object to get constructor names of.
 * @returns Constructor name.
 */
function getConstructorName(object: Record<string, any>): string {
  if (object.constructor.name) {
    return object.constructor.name
  }

  const CONSTRUCTOR_REGEX = /^class\s([^\s]*)/u
  const FUNCTION_REGEX = /^function\s+([^(]*)/u
  // try to guess it on legacy browsers (ie)
  const constructorString = object.constructor.toString()
  const functionConstructor = FUNCTION_REGEX.exec(constructorString)
  const classConstructor = CONSTRUCTOR_REGEX.exec(constructorString)
  return functionConstructor ? functionConstructor[1] : classConstructor[1]
}

export {getConstructorName, setPrototypeOf}
