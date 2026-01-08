declare module 'numero-a-letras' {
    interface Options {
        plural: string;
        singular: string;
        centPlural: string;
        centSingular: string;
    }
    export function numeroALetras(number: number, options?: Options): string;
}
