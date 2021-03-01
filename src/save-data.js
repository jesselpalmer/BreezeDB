import constants from './constants.js'
import createFile from './create-data-file.js'
import doesFileExist from './does-file-exist.js'
import loadFile from './load-data-file.js'
import printDataFromFile from './print-data-from-file.js'
import saveDataToFile from './save-data-to-file.js'

const saveData = async (key, value) => {
  const dataFileUri = constants.DEFAULT_DATA_FILENAME_URI

  doesFileExist(dataFileUri) ? true : await createFile(dataFileUri)
  
  await printDataFromFile(
    await saveDataToFile(
      dataFileUri,
      await loadFile(dataFileUri),
      key,
      value
    )
  )
}

export default saveData
