import axios from "axios"

export const handleResponse = async (apiURI: string, value: string, languageCode: string) => {
  try {
    const addUserMessageResult = await axios.post<string>(apiURI, {
      queryInput: {
        text: {
          text: value
        },
        languageCode: languageCode ?? "en"
      }
    })

    let JSONBeginningIndex = 0
    while (addUserMessageResult.data[JSONBeginningIndex] !== '{') {
      JSONBeginningIndex++
    }
    const responseJSON = JSON.parse(addUserMessageResult.data.substr(JSONBeginningIndex))

    return responseJSON
  } catch (err) {
    console.log(err)
    return {};
  }
}
