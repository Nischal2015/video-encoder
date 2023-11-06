'use strict';
import {
  MediaConvertClient,
  CreateJobCommand,
} from '@aws-sdk/client-mediaconvert';

const mediaconvert = new MediaConvertClient({
  endpoint: process.env.MEDIA_ENDPOINT,
});

const outputBucket = process.env.TRANSCODE_VIDEO_BUCKET;

export const videoTranscoder = async (event) => {
  const s3 = event.Records[0].s3;
  const key = s3.object.key;
  const sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));
  const outputKey = sourceKey.split('.')[0];
  const uploadBucket = s3.bucket.name;

  const input = `s3://${uploadBucket}/${key}`;
  const output = `s3://${outputBucket}/${outputKey}/`;

  try {
    const params = {
      Role: process.env.MEDIA_ROLE,
      Settings: {
        Inputs: [
          {
            FileInput: input,
            AudioSelectors: {
              'Audio Selector 1': {
                SelectorType: 'TRACK',
                Tracks: [1],
              },
            },
          },
        ],
        OutputGroups: [
          {
            Name: 'File Group',
            Outputs: [
              {
                Preset:
                  'System-Generic_Hd_Mp4_Avc_Aac_16x9_1920x1080p_24Hz_6Mbps',
                Extension: 'mp4',
                NameModifier: '_16x9_1920x1080p_24Hz_6Mbps',
              },
              {
                Preset:
                  'System-Generic_Hd_Mp4_Avc_Aac_16x9_1280x720p_24Hz_4.5Mbps',
                Extension: 'mp4',
                NameModifier: '_16x9_1280x720p_24Hz_4.5Mbps',
              },
              {
                Preset:
                  'System-Generic_Sd_Mp4_Avc_Aac_4x3_640x480p_24Hz_1.5Mbps',
                Extension: 'mp4',
                NameModifier: '_4x3_640x480p_24Hz_1.5Mbps',
              },
            ],
            OutputGroupSettings: {
              Type: 'FILE_GROUP_SETTINGS',
              FileGroupSettings: {
                Destination: output,
              },
            },
          },
        ],
      },
    };

    await mediaconvert.send(new CreateJobCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully transcoded the video',
      }),
    };
  } catch (error) {
    console.error(error);
  }
};
