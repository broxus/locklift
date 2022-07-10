type TemplateProps = {
  name: string;
  params: string;
  returns: string;
  callReturns: string;
}

export function contractMethodTemplate({
  name,
  params,
  returns,
  callReturns,
}: TemplateProps): string {
  const template =
`    ${name}: {
      call(${!!params ? `params: ${params}, ` : ''}keyPair?: KeyPair): Promise<${callReturns}> {
        return Sample.prototype.call<${callReturns}, ${params || 'unknown'}>({
          method: '${name}', keyPair: keyPair || Sample.prototype.keyPair!${!!params ? ', params ' : ' '}
        });
      },
      run(${!!params ? `params: ${params}, ` : ''}keyPair?: KeyPair): Promise<ResultOfProcessMessage<${returns}>> {
        return Sample.prototype.run<${returns}, ${params || 'unknown'}>({
          method: '${name}', keyPair: keyPair || Sample.prototype.keyPair!${!!params ? ', params ' : ''}
        });
      },
    },
`

  return template;
}
