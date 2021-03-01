import { readFileSync } from 'fs'

const loadFile = dataFileUri => {
  const rawdata = readFileSync(dataFileUri)
  return JSON.parse(rawdata)
}

export default loadFile
