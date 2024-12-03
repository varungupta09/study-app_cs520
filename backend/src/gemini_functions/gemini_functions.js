const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

// Initialize GoogleGenerativeAI with your API_KEY.
const genAI = new GoogleGenerativeAI("AIzaSyBO7Jemx6L-szY2IL-LoCQA5Dyh2ZDV21I");
// Initialize GoogleAIFileManager with your API_KEY.
const fileManager = new GoogleAIFileManager("AIzaSyBO7Jemx6L-szY2IL-LoCQA5Dyh2ZDV21I");

/**
 * Function to create a study guide from an array of PDF file paths.
 * @param {string[]} filePaths - Array of PDF file paths.
 * @returns {string} Combined study guide generated by Gemini.
 */
async function createStudyGuide(filePaths) {
  try {
    const model = genAI.getGenerativeModel({
      // Choose a Gemini model.
      model: "gemini-1.5-flash",
    });

    const fileParts = [];
    const fileNames = [];

    for (const filePath of filePaths) {
      // Upload the file
      const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType: "application/pdf",
        displayName: `Uploaded ${filePath}`,
      });

      console.log(`Uploaded file: ${uploadResponse.file.uri}`);

      // Add uploaded file details to the fileParts array
      fileParts.push({
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      });

      fileNames.push({
        fileData: {
          name: uploadResponse.file.name,
          displayName: uploadResponse.file.displayName,
        },
      });
    }

    // Generate the study guide using all uploaded files
    const result = await model.generateContent([
      { text: "Create a detailed study guide for the provided documents." },
      ...fileParts,
    ]);

    // Delete all uploaded files
    for (const fileName of fileNames) {
      await fileManager.deleteFile(fileName.fileData.name);
      console.log(`Deleted file: ${fileName.fileData.displayName}`);
    }

    return result.response.text();
  } catch (error) {
    console.error("Error creating study guide:", error);
    throw error;
  }
}

/**
 * Function to create a multiple-choice quiz from an array of PDF file paths.
 * @param {string[]} filePaths - Array of PDF file paths.
 * @param {number} numQuestions - Number of questions for the quiz.
 * @returns {string} Combined multiple-choice quiz and answers.
 */
async function createQuiz(filePaths, numQuestions) {
  try {
    const schema = {
      "description": "List of multiple-choice test questions",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question": {
            "type": "string",
            "description": "The question text, no formatting",
            "nullable": false
          },
          "answers": {
            "type": "array",
            "description": "List of possible answers, no formatting",
            "items": {
              "type": "string"
            },
            "minItems": 2,
            "nullable": false
          },
          "correctAnswer": {
            "type": "integer",
            "description": "The index of the correct answer in the answers array, no formatting",
            "minimum": 0, // Ensure the index is within bounds
            "nullable": false
          }
        },
        "required": ["question", "answers", "correctAnswer"]
      }
    }

    const model = genAI.getGenerativeModel({
      // Choose a Gemini model.
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const fileParts = [];
    const fileNames = [];

    for (const filePath of filePaths) {
      // Upload the file
      const uploadResponse = await fileManager.uploadFile(filePath, {
        mimeType: "application/pdf",
        displayName: `Uploaded ${filePath}`,
      });

      console.log(`Uploaded file: ${uploadResponse.file.uri}`);

      // Add uploaded file details to the fileParts array
      fileParts.push({
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      });

      fileNames.push({
        fileData: {
          name: uploadResponse.file.name,
          displayName: uploadResponse.file.displayName,
        },
      });
    }

    // Generate the quiz using all uploaded files
    const result = await model.generateContent([
      { text: `Create a multiple-choice quiz with ${numQuestions} questions from the provided documents, including the correct answers.` },
      ...fileParts,
    ]);

    // Delete all uploaded files
    for (const fileName of fileNames) {
      await fileManager.deleteFile(fileName.fileData.name);
      console.log(`Deleted file: ${fileName.fileData.displayName}`);
    }

    return result.response.text();
  } catch (error) {
    console.error("Error creating quiz:", error);
    throw error;
  }
}

/*
// Example usage:
// (Make sure the paths and API key are set correctly in your environment)
(async () => {
  try {
    const filePaths = ["test.pdf"]//["media/gemini1.pdf", "media/gemini2.pdf"];

    //const studyGuide = await createStudyGuide(filePaths);
    //console.log("Combined Study Guide:\n", studyGuide);

    const quiz = await createQuiz(filePaths, 10);
    console.log("Combined Quiz:\n", quiz);
  } catch (error) {
    console.error("An error occurred during processing.");
  }
})();
*/
module.exports = { createStudyGuide, createQuiz };