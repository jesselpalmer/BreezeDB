import { readFileSync } from 'fs'

const loadFile = (dataFile) => {
  const rawdata = readFileSync(dataFile)
  return JSON.parse(rawdata)
}

export default loadFile
