export type ForcaSenha = "vazia" | "fraca" | "media" | "forte";
export type AvaliacaoSenha = {
  forca: ForcaSenha;
  percentual: number;
  rotulo: string;
  sugestao: string;
  aceita: boolean;
};

const obvias = [
  "123456", "12345678", "abcdef", "qwerty", "password",
  "senha123", "admin123", "toaki", "111111", "000000", "asdfgh"
];

export function avaliarSenha(senha: string, email = "", nome = ""): AvaliacaoSenha {
  if (!senha) return {forca:"vazia",percentual:0,rotulo:"",sugestao:"Use 12 caracteres ou mais. Uma frase longa e exclusiva é uma boa opção.",aceita:false};

  const normalizada=senha.toLocaleLowerCase("pt-BR");
  const localEmail=email.split("@")[0]?.trim().toLocaleLowerCase("pt-BR") ?? "";
  const partesNome=nome.toLocaleLowerCase("pt-BR").split(/\s+/).filter(parte=>parte.length>=4);
  const pessoal=(localEmail.length>=4 && normalizada.includes(localEmail)) || partesNome.some(parte=>normalizada.includes(parte));
  const comum=obvias.some(termo=>normalizada.includes(termo))
    || /(.)\1{4,}/u.test(senha)
    || /(?:012345|123456|234567|345678|456789|987654|876543)/.test(senha);

  if (senha.length < 12) return {forca:"fraca",percentual:28,rotulo:"Fraca",sugestao:"Aumente para pelo menos 12 caracteres.",aceita:false};
  if (senha.length > 128) return {forca:"fraca",percentual:28,rotulo:"Fraca",sugestao:"Use no máximo 128 caracteres.",aceita:false};
  if (pessoal || comum) return {forca:"fraca",percentual:28,rotulo:"Fraca",sugestao:"Evite seu nome, e-mail e sequências comuns.",aceita:false};

  const categorias=[/[a-zà-ÿ]/u,/[A-ZÀ-Ÿ]/u,/\d/u,/[^\p{L}\p{N}\s]/u].filter(re=>re.test(senha)).length;
  const palavras=senha.trim().split(/\s+/).filter(Boolean).length;
  const fraseLonga=senha.length>=20 && palavras>=4;

  if (fraseLonga || (senha.length>=16 && categorias>=3)) {
    return {forca:"forte",percentual:100,rotulo:"Forte",sugestao:"Boa escolha. Use uma senha exclusiva para o toAki.",aceita:true};
  }
  if (senha.length>=12 && (categorias>=2 || palavras>=3 || senha.length>=20)) {
    return {forca:"media",percentual:64,rotulo:"Média",sugestao:"Boa base. Uma senha mais longa e variada será ainda melhor.",aceita:true};
  }
  return {forca:"fraca",percentual:28,rotulo:"Fraca",sugestao:"Combine palavras diferentes ou aumente o comprimento.",aceita:false};
}
