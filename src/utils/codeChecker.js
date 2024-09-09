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