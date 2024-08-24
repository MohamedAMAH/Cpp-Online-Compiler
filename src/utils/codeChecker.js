exports.codeRequiresInput = (code) => {
    const inputPatterns = [
      /std::cin/,
      /cin\s*>>/,
      /std::getline/,
      /scanf/,
      /fgets/
    ];
    return inputPatterns.some(pattern => pattern.test(code));
};