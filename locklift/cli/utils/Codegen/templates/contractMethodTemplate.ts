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
      call(${params}): ${returns} {
        return this.call({ method: '${name}'${!!params ? ', params ' : ' '}});
      },
      run(${params}): ${returns} {
        return this.run({ method: '${name}'${!!params ? ', params ' : ' '}});
      },
    },
`

  return template;
}
