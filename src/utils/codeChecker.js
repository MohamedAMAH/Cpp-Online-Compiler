exports.codeRequiresInput = (code) => {
  const inputKeywords = [
      'cin',
      'getline',
      'scanf',
      'fgets',
      'istream >>',
      'istream::read',
      'istream::get',
      'istream::ignore'
  ];
  return inputKeywords.some(keyword => code.includes(keyword));
};
// exports.codeRequiresInput = (code) => {
//   const inputPatterns = [
//       /std\s*::\s*cin/,
//       /cin\s*>>/,
//       /std\s*::\s*getline\s*\(/,
//       /scanf\s*\(/,
//       /fgets\s*\(/,
//       /istream\s*>>/,
//       /istream\s*::\s*read\s*\(/,
//       /istream\s*::\s*get\s*\(/,
//       /istream\s*::\s*ignore\s*\(/,
//       />>\s*[\w<>\s]*\s*\(/
//   ];
//   return inputPatterns.some(pattern => pattern.test(code));
// };
// exports.codeRequiresInput = (code) => {
//     const inputPatterns = [
//       /std::cin/,
//       /cin\s*>>/,
//       /std::getline/,
//       /scanf/,
//       /fgets/
//     ];
//     return inputPatterns.some(pattern => pattern.test(code));
// };