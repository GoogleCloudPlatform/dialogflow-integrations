import axios from "axios"

export const handleResponse = async (apiURI: string, languageCode?: string, value?: string, event?: boolean) => {
  const queryObj = event ? {
    event: {
      event: value
    }
  } : {
    text: {
      text: value
    }
  }

  try {
    const addUserMessageResult = await axios.post<string>(apiURI, {
      queryInput: {
        ...queryObj,
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
    console.log((err as any).response)
    return {};
  }
}
