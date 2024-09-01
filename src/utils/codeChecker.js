exports.codeRequiresInput = (code) => {
  const inputPatterns = [
      /std\s*::\s*cin/,
      /cin\s*>>/,
      /std\s*::\s*getline/,
      /scanf\s*\(/,
      /fgets\s*\(/,
      /istream\s*>>/,
      /istream\s*::\s*read/,
      /istream\s*::\s*get/,
      /istream\s*::\s*ignore/,
      />>\s*[\w<>\s]*\s*\(/ 
  ];
  return inputPatterns.some(pattern => pattern.test(code));
};
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