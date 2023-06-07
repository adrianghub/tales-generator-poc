const { Configuration, OpenAIApi } = require("openai");

require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function createCompletion(messages) {
  try {
    const response = await openai.createChatCompletion({
      model: process.env.OPENAI_MODEL,
      messages: messages
    });

    const completion = response.data.choices[0].message.content;
    return completion;
  } catch (error) {
    console.error('Error creating completion:', error);
    throw error;
  }
}

module.exports = {
  createCompletion
};

