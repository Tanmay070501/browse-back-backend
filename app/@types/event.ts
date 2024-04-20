type Headers = Record<string, string>;
type Body =
  | string
  | Document
  | Blob
  | ArrayBufferView
  | ArrayBuffer
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | null;

  export type InitiatorType =
  | 'audio'
  | 'beacon'
  | 'body'
  | 'css'
  | 'early-hint'
  | 'embed'
  | 'fetch'
  | 'frame'
  | 'iframe'
  | 'icon'
  | 'image'
  | 'img'
  | 'input'
  | 'link'
  | 'navigation'
  | 'object'
  | 'ping'
  | 'script'
  | 'track'
  | 'video'
  | 'xmlhttprequest'
  | 'other';

export type NetworkRequest = {
  url: string;
  method?: string;
  initiatorType: InitiatorType;
  status?: number;
  startTime: number;
  endTime: number;
  requestHeaders?: Headers;
  requestBody?: Body;
  responseHeaders?: Headers;
  responseBody?: Body;
};

export interface EventWithTime {
    timestamp: number,
    data: any,
    type: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    delay?: number
}
