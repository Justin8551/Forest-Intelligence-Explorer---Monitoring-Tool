(function (global) {
  class ZebraHackClient {
    constructor({
      baseUrl = "https://zebrahack.iqnox.tech",
      appKey = "",
    } = {}) {
      this.baseUrl = baseUrl.replace(/\/$/, "");
      this.appKey = appKey;
    }

    async request(path) {
      const headers = {
        "Content-Type": "application/json",
      };
      if (this.appKey) {
        headers["X-App-Key"] = this.appKey;
      }
      
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error ${response.status}`);
      }

      return response.json();
    }

    health() {
      return this.request("/api/health");
    }


    getCompanies(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/api/companies?${queryString}`);
    }

    getInsights(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      return this.request(`/api/insights?${queryString}`);
    }
    
  }

  global.ZebraHackApi = {
    ZebraHackClient,
    createClient: (config) => new ZebraHackClient(config || {}),
  };
})(window);