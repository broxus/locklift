type TemplateProps = {
  name: string;
  params: string;
  returns: string;
}

export function contractMethodTemplate({
  name,
  params,
  returns,
}: TemplateProps): string {
  const template =
`    ${name}: {
      call(${!!params ? `params: ${params}` : ''}): ${returns} {
        return this.call<${returns}, ${params || 'unknown'}>({ method: '${name}'${!!params ? ', params ' : ' '}});
      },
      run(${!!params ? `params: ${params}` : ''}): ResultOfProcessMessage<${returns}> {
        return this.run<${returns}, ${params || 'unknown'}>({ method: '${name}'${!!params ? ', params ' : ' '}});
      },
    },
`

  return template;
}
