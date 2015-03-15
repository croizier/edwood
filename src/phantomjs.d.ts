declare var phantom: {
    exit(returnValue?: any): boolean;
    onError: (msg: string, trace: string[]) => any;
};

declare module 'fs' {
    interface Stream {
        close(): void;
        read(): string;
        write(data: string): void;
    }

    function makeDirectory(path: string): void;
    function open(path: string, mode: string): Stream;
}

interface Error {
    stack: string;
}
