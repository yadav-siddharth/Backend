// const asyncHandler = (requestHandler) => {
//   return (req, res, next) => {
//     Promise.then(requestHandler(req, res, next)).catch((err) => next(err));
//   };
//   // async (req, res, next) => {
//   //   try {
//   //     await requestHandler(req, res, next);
//   //   } catch (error) {
//   //     next(error);
//   //   }
//   // };
// };

// export { asyncHandler };

const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
