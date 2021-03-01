import { writeFileSync } from 'fs'

const saveDataToFile = (fileName, data, key, value) => {
  data[key] = value
  const newData = JSON.stringify(data)
  writeFileSync(fileName, newData)
  return data
}

export default saveDataToFile
