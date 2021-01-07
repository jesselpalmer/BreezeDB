const fs = require('fs')

const saveData = (dataFile, data, key, value) => {
  data[key] = value
  const newData = JSON.stringify(data)
  fs.writeFileSync(dataFile, newData)
  return data
}

module.exports = saveData
