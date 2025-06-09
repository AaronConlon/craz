export class TabsAPI {
  static async getTabs() {
    const tabs = await chrome.tabs.query({})
    return tabs
  }

  static async getTab(tabId: number) {
    const tab = await chrome.tabs.get(tabId)
    return tab
  }

  static async getTabByUrl(url: string) {
    const tabs = await chrome.tabs.query({ url })
    return tabs[0]
  }
}
