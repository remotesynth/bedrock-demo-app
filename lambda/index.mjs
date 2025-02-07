import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';

const PLATFORM_CHR_LIMITS = {
  Mastodon: 500,
  BlueSky: 300,
  Threads: 500,
};

const client = new BedrockRuntimeClient({ region: 'us-east-1' }); // Adjust region as needed

const generatePrompt = (message, platform, characterLimit) => {
  return `Given this social media post idea: "${message}" 

${
  message.length > characterLimit ? 'Shorten' : 'Expand'
} this message to be appropriate for ${platform}, which has a ${characterLimit} character limit. 
Maintain the tone and core message while ${
    message.length > characterLimit
      ? 'being more concise'
      : 'adding relevant details'
  }.
The response should only contain the revised message, nothing else.`;
};

const invokeModel = async (prompt) => {
  const command = new ConverseCommand({
    modelId: 'meta.llama3-8b-instruct-v1:0',
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    temperature: 0.7,
  });

  try {
    const response = await client.send(command);
    const result = new TextDecoder().decode(response.body);
    console.log(result);
    return result.messages[0].content;
  } catch (error) {
    console.error('Error invoking Bedrock:', error);
    throw error;
  }
};

export const handler = async (event) => {
  try {
    const { message, platforms } = event.body;

    if (!message || !platforms || !Array.isArray(platforms)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid input. Required: message and an array of platforms',
        }),
      };
    }

    const results = await Promise.all(
      platforms.map(async (platform) => {
        if (!PLATFORM_CHR_LIMITS[platform]) {
          throw new Error(`Unsupported platform: ${platform}`);
        }

        const prompt = generatePrompt(
          message,
          platform,
          PLATFORM_CHR_LIMITS[platform]
        );
        console.log(prompt);
        const generatedText = await invokeModel(prompt);

        return {
          platform,
          message: generatedText,
        };
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ results }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
