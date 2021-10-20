export const getAttributes = (domElement: Element): {[key: string]: string} => {
  let attributes: {[key: string]: string} = {}
  for (let i = 0; i < domElement.attributes.length; i++) {
    const attribute = domElement.attributes.item(i)
    if (attribute) {
      attributes[attribute.name] = attribute.value;
    }
  }
  return attributes;
}
