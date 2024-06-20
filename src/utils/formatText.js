const formatText = (name) => {
  const formattedText = decodeURIComponent(name).replaceAll(/%20/g, " ");
  return formattedText;
};

export default formatText;
