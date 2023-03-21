export interface Elements {
  form: HTMLFormElement;
  input: HTMLInputElement;
  button: HTMLButtonElement;
  feedback: HTMLElement;
  posts: HTMLElement;
  feeds: HTMLElement;
  modalHeader: HTMLElement;
  modalText: HTMLElement;
  modalLink: HTMLElement;
}

export interface InitialState {
  form: {
    error: null | string;
  };
  loadingProcess: {
    status: null | string;
    error: null | string;
  };
  feeds: any[]; // replace "any" with the actual type of objects stored in the feeds array
  posts: any[]; // replace "any" with the actual type of objects stored in the posts array
  ui: {
    posts: {
      visitedIds: Set<number>;
    };
  };
}

export interface Data {
  url: string
}

export interface ParsingError extends Error {
  isParsingError: boolean;
}
