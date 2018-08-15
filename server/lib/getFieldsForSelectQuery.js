module.exports = function(model, table, isRoot) {
  let modelFields = Object.keys(model.rawAttributes).map((field) => {
    return `"${table}"."${field}"` + (isRoot ? '' : ` AS "${table.replace('->', '.')}.${field}"`);
  });
  console.log(modelFields);
  return modelFields.join();
};
