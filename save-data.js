const fs = require('fs')

const saveData = (fileName, data, key, value) => {
  data[key] = value
  const newData = JSON.stringify(data)
  fs.writeFileSync(fileName, newData)
  return data
}

module.exports = saveData
