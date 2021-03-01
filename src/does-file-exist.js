import fs from 'fs'

const doesFileExist = fileName => fs.existsSync(fileName)

export default doesFileExist
