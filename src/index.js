import insomnia from "./insomnia.json";

const parseUrl = url => {
  let protocol, host, path, query;
  const rest = {};
  if (typeof url === "undefined") return {};
  if (url.includes("https://")) protocol = "https";
  if (url.includes("http://")) protocol = "http";

  path = url.replace(`${protocol}://`, "").split("/");
  host = path.shift().split(".");
  query = [...path].pop().split("?");

  if (query.length > 1) {
    query = query.pop();
    const lastPath = path[path.length - 1].replace(`?${query}`, "");
    path[path.length - 1] = lastPath;
    query = query.split("&").map(q => {
      const [key, value] = q.split("=");
      return {
        key,
        value
      };
    });

    rest.query = query;
  }

  if (protocol) {
    rest.protocol = protocol;
  }

  return {
    host,
    path,
    ...rest
  };
};

const parseBody = body => {
  if (!body.mimeType) return {};
  const rest = {};
  const mode = body.mimeType === "multipart/form-data" ? "formdata" : "raw";

  if (mode === "formdata") {
    rest.formdata = body.params.map(param => ({
      key: param.name,
      value: param.value,
      type: "text"
    }));
  } else {
    rest.raw = body.text;
    rest.options = {
      raw: {
        language: "json"
      }
    };
  }

  return {
    mode,
    ...rest
  };
};

const postman = {
  item: insomnia.resources
    .filter(res => res._type === "request")
    .map(resource => ({
      name: resource.name,
      request: {
        method: resource.method,
        header: resource.headers.map(header => ({
          key: header.name,
          value: header.value,
          type: "text"
        })),
        url: {
          raw: resource.url,
          ...parseUrl(resource.url)
        },
        body: parseBody(resource.body)
      }
    }))
};

const enviroments = insomnia.resources
  .filter(res => res._type === "environment")
  .map(env => ({
    name: env.name,
    values: Object.entries(env.data).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }))
  }));

console.log(postman, enviroments);
