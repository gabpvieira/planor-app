declare module 'mic-recorder-to-mp3' {
  export interface MicRecorderOptions {
    bitRate?: number;
  }

  export default class MicRecorder {
    constructor(options?: MicRecorderOptions);
    start(): Promise<void>;
    stop(): {
      getMp3(): Promise<[Uint8Array[], Blob]>;
    };
  }
}
