import axios from 'axios'

interface IikoConfig {
  serverUrl: string // e.g., https://your-iiko-server:443
  login: string
  password: string // SHA1 hash of password
}

interface IikoAuthResponse {
  token: string
}

interface OlapReportFilter {
  dateFrom: string // YYYY-MM-DD
  dateTo: string // YYYY-MM-DD
  departmentId?: string
}

interface OlapSalesItem {
  dishId: string
  dishName: string
  dishCode: string
  dishCategory: string
  dishCategoryId: string
  dishGroup: string
  dishGroupId: string
  quantity: number
  amount: number
  discountSum: number
  orderNum: string
  openTime: string
  departmentId: string
  departmentName: string
}

interface OlapReportResponse {
  data: OlapSalesItem[]
  summary: {
    totalAmount: number
    totalQuantity: number
    totalDiscount: number
  }
}

export class IikoService {
  private config: IikoConfig
  private token: string | null = null
  private tokenExpiry: Date | null = null

  constructor(config: IikoConfig) {
    this.config = config
  }

  /**
   * Authenticate with iiko Server API
   * Token is valid for ~15 minutes
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token
    }

    try {
      const authUrl = `${this.config.serverUrl}/resto/api/auth`
      console.log('iiko auth URL:', authUrl)
      console.log('iiko login:', this.config.login)

      const response = await axios.get<string>(
        authUrl,
        {
          params: {
            login: this.config.login,
            pass: this.config.password,
          },
          timeout: 10000,
        }
      )

      this.token = response.data
      // Token expires in 15 minutes, we'll refresh after 10
      this.tokenExpiry = new Date(Date.now() + 10 * 60 * 1000)

      return this.token!
    } catch (error: any) {
      console.error('iiko authentication failed:', error)
      const message = error.response?.data || error.message || 'Unknown error'
      throw new Error(`Failed to authenticate with iiko server: ${message}`)
    }
  }

  /**
   * Logout and release the API license
   */
  async logout(): Promise<void> {
    if (!this.token) return

    try {
      await axios.get(`${this.config.serverUrl}/resto/api/logout`, {
        params: { key: this.token },
        timeout: 5000,
      })
    } catch (error) {
      console.error('iiko logout failed:', error)
    } finally {
      this.token = null
      this.tokenExpiry = null
    }
  }

  /**
   * Get OLAP sales report with detailed item breakdown
   * Filters: only closed orders, exclude deleted and voided items
   */
  async getSalesReport(filter: OlapReportFilter): Promise<OlapReportResponse> {
    const token = await this.authenticate()

    try {
      const requestBody = {
        reportType: 'SALES',
        buildSummary: 'true',
        groupByRowFields: [
          'Department.Id',
          'Department',
          'DishId',
          'DishName',
          'DishCode',
          'DishCategory',
          'DishCategory.Id',
          'DishGroup',
          'DishGroup.Id',
          'OpenTime',
          'OrderNum',
        ],
        groupByColFields: [],
        aggregateFields: [
          'DishAmountInt',
          'DishDiscountSumInt',
          'DishSumInt',
        ],
        filters: {
          'OpenDate.Typed': {
            filterType: 'DateRange',
            periodType: 'CUSTOM',
            from: filter.dateFrom,
            to: filter.dateTo,
            includeLow: true,
            includeHigh: true,
          },
          ...(filter.departmentId && {
            'Department.Id': {
              filterType: 'IncludeValues',
              values: [filter.departmentId],
            },
          }),
        },
      }

      const response = await axios.post(
        `${this.config.serverUrl}/resto/api/v2/reports/olap`,
        requestBody,
        {
          params: { key: token },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      return this.parseOlapResponse(response.data)
    } catch (error: any) {
      console.error('Failed to get iiko sales report:', error)
      const message = error.response?.data || error.message || 'Unknown error'
      throw new Error(`Failed to fetch sales report from iiko: ${JSON.stringify(message)}`)
    }
  }

  /**
   * Get revenue summary for a period
   */
  async getRevenueSummary(filter: OlapReportFilter): Promise<{
    totalRevenue: number
    totalOrders: number
    itemsSold: number
    averageCheck: number
    byCategory: Array<{ category: string; amount: number; quantity: number }>
    byHour: Array<{ hour: number; amount: number }>
  }> {
    const report = await this.getSalesReport(filter)

    // Group by category
    const categoryMap = new Map<string, { amount: number; quantity: number }>()
    const hourMap = new Map<number, number>()
    const orderSet = new Set<string>()

    for (const item of report.data) {
      orderSet.add(item.orderNum)

      // By category
      const existing = categoryMap.get(item.dishCategory) || { amount: 0, quantity: 0 }
      categoryMap.set(item.dishCategory, {
        amount: existing.amount + item.amount,
        quantity: existing.quantity + item.quantity,
      })

      // By hour
      const hour = new Date(item.openTime).getHours()
      hourMap.set(hour, (hourMap.get(hour) || 0) + item.amount)
    }

    const totalOrders = orderSet.size
    const averageCheck = totalOrders > 0 ? report.summary.totalAmount / totalOrders : 0

    return {
      totalRevenue: report.summary.totalAmount,
      totalOrders,
      itemsSold: report.summary.totalQuantity,
      averageCheck,
      byCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        quantity: data.quantity,
      })),
      byHour: Array.from(hourMap.entries())
        .map(([hour, amount]) => ({ hour, amount }))
        .sort((a, b) => a.hour - b.hour),
    }
  }

  /**
   * Get list of departments/restaurants
   */
  async getDepartments(): Promise<Array<{ id: string; name: string }>> {
    const token = await this.authenticate()

    try {
      const response = await axios.get(
        `${this.config.serverUrl}/resto/api/corporation/departments`,
        {
          params: { key: token },
          timeout: 10000,
        }
      )

      // Parse XML response or JSON depending on iiko version
      const departments = this.parseDepartmentsResponse(response.data)
      return departments
    } catch (error) {
      console.error('Failed to get iiko departments:', error)
      throw new Error('Failed to fetch departments from iiko')
    }
  }

  /**
   * Parse OLAP response from iiko
   */
  private parseOlapResponse(data: any): OlapReportResponse {
    const items: OlapSalesItem[] = []
    let totalAmount = 0
    let totalQuantity = 0
    let totalDiscount = 0

    // Handle different response formats
    const rows = data.data || data.rows || []

    // Log first row to see structure
    if (rows.length > 0) {
      console.log('iiko OLAP first row keys:', Object.keys(rows[0]))
      console.log('iiko OLAP first row sample:', JSON.stringify(rows[0]).substring(0, 500))
    } else {
      console.log('iiko OLAP: no rows returned')
    }

    for (const row of rows) {
      const item: OlapSalesItem = {
        dishId: row['DishId'] || row['Dish.Id'] || '',
        dishName: row['DishName'] || row['Dish.Name'] || '',
        dishCode: row['DishCode'] || row['Dish.Code'] || '',
        dishCategory: row['DishCategory'] || row['Dish.Category'] || '',
        dishCategoryId: row['DishCategory.Id'] || '',
        dishGroup: row['DishGroup'] || row['Dish.Group'] || '',
        dishGroupId: row['DishGroup.Id'] || '',
        quantity: parseFloat(row['DishAmountInt'] || row['Amount'] || 0),
        amount: parseFloat(row['DishSumInt'] || row['Sum'] || 0),
        discountSum: parseFloat(row['DishDiscountSumInt'] || row['Discount'] || 0),
        orderNum: row['OrderNum'] || row['Order.Number'] || '',
        openTime: row['OpenTime'] || row['CloseTime'] || row['OpenDate'] || '',
        departmentId: row['Department.Id'] || '',
        departmentName: row['Department'] || row['Department.Name'] || '',
      }

      items.push(item)
      totalAmount += item.amount
      totalQuantity += item.quantity
      totalDiscount += item.discountSum
    }

    console.log(`iiko OLAP: ${rows.length} total rows, ${items.length} parsed`)

    return {
      data: items,
      summary: {
        totalAmount,
        totalQuantity,
        totalDiscount,
      },
    }
  }

  /**
   * Parse departments response
   */
  private parseDepartmentsResponse(data: any): Array<{ id: string; name: string }> {
    // Handle JSON response
    if (Array.isArray(data)) {
      return data.map((d: any) => ({
        id: d.id || d.Id,
        name: d.name || d.Name,
      }))
    }

    // Handle object with departments array
    if (data.corporateItemDtoes || data.departments) {
      const deps = data.corporateItemDtoes || data.departments
      return deps.map((d: any) => ({
        id: d.id || d.Id,
        name: d.name || d.Name,
      }))
    }

    return []
  }

  /**
   * Test connection to iiko server
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.authenticate()
      await this.logout()
      return { success: true, message: 'Successfully connected to iiko server' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, message }
    }
  }

  /**
   * Get sales by departments - alternative to OLAP
   * This might give different (more accurate) results
   */
  async getSalesByDepartment(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      // Try the sales report endpoint
      const response = await axios.get(
        `${this.config.serverUrl}/resto/api/reports/sales`,
        {
          params: {
            key: token,
            dateFrom: filter.dateFrom,
            dateTo: filter.dateTo,
          },
          timeout: 30000,
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Sales by department error:', error.response?.data || error.message)
      // Return error info for debugging
      return { error: error.response?.data || error.message }
    }
  }

  /**
   * Get "Отчет по дням новый" - the accurate daily report
   * This report shows correct data with discounts applied
   * presetId: c459326a-23d5-4088-9235-880634607c22
   */
  async getDailyReport(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      // Format dates as DD.MM.YYYY for iiko
      const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-')
        return `${day}.${month}.${year}`
      }

      const response = await axios.get(
        `${this.config.serverUrl}/resto/service/reports/report.jspx`,
        {
          params: {
            key: token,
            dateFrom: formatDate(filter.dateFrom),
            dateTo: formatDate(filter.dateTo),
            presetId: 'c459326a-23d5-4088-9235-880634607c22', // "Отчет по дням новый"
          },
          timeout: 30000,
          responseType: 'text',
        }
      )

      // Parse XML response
      const xmlData = response.data
      return this.parseDailyReportXml(xmlData)
    } catch (error: any) {
      console.error('Daily report error:', error.response?.data || error.message)
      return { error: error.response?.data || error.message }
    }
  }

  /**
   * Parse XML from daily report
   */
  private parseDailyReportXml(xml: string): any {
    const items: any[] = []

    // Simple XML parsing - find all row data
    // The XML structure contains sales data in a specific format
    // We'll extract: date, category, dish, payment type, amount (with discount), quantity

    try {
      // Look for data rows in XML
      // Pattern: <r> tags or similar containing the data
      const rowRegex = /<r[^>]*>([\s\S]*?)<\/r>/gi
      const cellRegex = /<c[^>]*>([^<]*)<\/c>/gi

      let match
      while ((match = rowRegex.exec(xml)) !== null) {
        const rowContent = match[1]
        const cells: string[] = []

        let cellMatch
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
          cells.push(cellMatch[1])
        }

        if (cells.length >= 5) {
          items.push({
            date: cells[0],
            category: cells[1],
            dishName: cells[2],
            paymentType: cells[3],
            amount: parseFloat(cells[4]) || 0,
            quantity: parseFloat(cells[5]) || 0,
          })
        }
      }

      // If regex didn't work, return raw XML for debugging
      if (items.length === 0) {
        // Try to find any numeric data patterns
        const preview = xml.substring(0, 2000)
        return {
          rawXmlPreview: preview,
          message: 'Could not parse XML structure, returning preview for analysis'
        }
      }

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

      return {
        items,
        summary: {
          totalAmount,
          totalQuantity,
          itemCount: items.length,
        }
      }
    } catch (error) {
      return {
        error: 'Failed to parse XML',
        rawXmlPreview: xml.substring(0, 2000)
      }
    }
  }

  /**
   * Get orders list - to see individual orders
   */
  async getOrders(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      const response = await axios.get(
        `${this.config.serverUrl}/resto/api/orders`,
        {
          params: {
            key: token,
            dateFrom: filter.dateFrom + 'T00:00:00',
            dateTo: filter.dateTo + 'T23:59:59',
          },
          timeout: 30000,
        }
      )

      return response.data
    } catch (error: any) {
      console.error('Get orders error:', error.response?.data || error.message)
      return { error: error.response?.data || error.message }
    }
  }

  /**
   * Get raw OLAP report for debugging - returns exact iiko response
   */
  async getRawOlapReport(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      const requestBody = {
        reportType: 'SALES',
        buildSummary: 'true',
        groupByRowFields: [
          'Department.Id',
          'Department',
          'DishId',
          'DishName',
          'DishCode',
          'DishCategory',
          'DishCategory.Id',
          'DishGroup',
          'DishGroup.Id',
          'OpenTime',
          'OrderNum',
        ],
        groupByColFields: [],
        aggregateFields: [
          'DishAmountInt',
          'DishDiscountSumInt',
          'DishSumInt',
        ],
        filters: {
          'OpenDate.Typed': {
            filterType: 'DateRange',
            periodType: 'CUSTOM',
            from: filter.dateFrom,
            to: filter.dateTo,
            includeLow: true,
            includeHigh: true,
          },
        },
      }

      const response = await axios.post(
        `${this.config.serverUrl}/resto/api/v2/reports/olap`,
        requestBody,
        {
          params: { key: token },
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      )

      return {
        requestBody,
        response: response.data,
        rowCount: (response.data.data || response.data.rows || []).length,
      }
    } catch (error: any) {
      const message = error.response?.data || error.message || 'Unknown error'
      throw new Error(`Failed to fetch raw OLAP report: ${JSON.stringify(message)}`)
    }
  }
}

// Singleton instance for the app
let iikoServiceInstance: IikoService | null = null

export function getIikoService(config?: IikoConfig): IikoService | null {
  if (config) {
    iikoServiceInstance = new IikoService(config)
  }
  return iikoServiceInstance
}

export function initIikoService(config: IikoConfig): IikoService {
  iikoServiceInstance = new IikoService(config)
  return iikoServiceInstance
}
