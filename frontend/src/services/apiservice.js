const processRequest = async (
  url,
  requestOptions,
  successHandler,
  errorHandler
) => {
  try {
    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      const errorData = await response.json();
      errorHandler(errorData);
      throw new error({ status: response.status, error: errorData });
    } else {
      const result = await response.json();
      successHandler(result);
    }
  } catch (error) {
    console.log("Api process request error", error);
  }
};

class apiService {
  getRequest(url, headers, successHandler, errorHandler) {
    const requestOptions = {
      method: "GET",
      headers: { ...headers },
    };

    processRequest(url, requestOptions, successHandler, errorHandler);
  }

  postRequest(url, headers, body, successHandler, errorHandler) {
    const requestOptions = {
      method: "POST",
      headers: { ...headers },
      body: body,
    };

    processRequest(url, requestOptions, successHandler, errorHandler);
  }

  deleteRequest(url, headers, body, successHandler, errorHandler) {
    const requestOptions = {
      method: "DELETE",
      headers: { ...headers },
      body: body,
    };

    processRequest(url, requestOptions, successHandler, errorHandler);
  }

  putRequest(url, headers, body, successHandler, errorHandler) {
    const requestOptions = {
      method: "PUT",
      headers: { ...headers },
      body: body,
    };

    processRequest(url, requestOptions, successHandler, errorHandler);
  }

  patchRequest(url, headers, body, successHandler, errorHandler) {
    const requestOptions = {
      method: "PATCH",
      headers: { ...headers },
      body: body,
    };

    processRequest(url, requestOptions, successHandler, errorHandler);
  }
}

export { apiService };
