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
   * Filters: exclude deleted orders and storned items for accurate data
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
   * NET revenue = DishSumInt - DishDiscountSumInt
   */
  private parseOlapResponse(data: any): OlapReportResponse {
    const items: OlapSalesItem[] = []
    let totalGrossAmount = 0
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
      const grossAmount = parseFloat(row['DishSumInt'] || row['Sum'] || 0)
      const discount = parseFloat(row['DishDiscountSumInt'] || row['Discount'] || 0)
      const netAmount = grossAmount - discount  // NET = GROSS - DISCOUNT

      const item: OlapSalesItem = {
        dishId: row['DishId'] || row['Dish.Id'] || '',
        dishName: row['DishName'] || row['Dish.Name'] || '',
        dishCode: row['DishCode'] || row['Dish.Code'] || '',
        dishCategory: row['DishCategory'] || row['Dish.Category'] || '',
        dishCategoryId: row['DishCategory.Id'] || '',
        dishGroup: row['DishGroup'] || row['Dish.Group'] || '',
        dishGroupId: row['DishGroup.Id'] || '',
        quantity: parseFloat(row['DishAmountInt'] || row['Amount'] || 0),
        amount: netAmount,  // Store NET amount, not gross
        discountSum: discount,
        orderNum: row['OrderNum'] || row['Order.Number'] || '',
        openTime: row['OpenTime'] || row['CloseTime'] || row['OpenDate'] || '',
        departmentId: row['Department.Id'] || '',
        departmentName: row['Department'] || row['Department.Name'] || '',
      }

      items.push(item)
      totalGrossAmount += grossAmount
      totalQuantity += item.quantity
      totalDiscount += discount
    }

    const totalNetAmount = totalGrossAmount - totalDiscount

    console.log(`iiko OLAP: ${rows.length} rows, gross=${totalGrossAmount}, discount=${totalDiscount}, NET=${totalNetAmount}`)

    return {
      data: items,
      summary: {
        totalAmount: totalNetAmount,  // Return NET amount
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

      const url = `${this.config.serverUrl}/resto/service/reports/report.jspx`
      const params = {
        key: token,
        dateFrom: formatDate(filter.dateFrom),
        dateTo: formatDate(filter.dateTo),
        presetId: 'c459326a-23d5-4088-9235-880634607c22',
      }

      console.log('Daily report URL:', url)
      console.log('Daily report params:', params)

      const response = await axios.get(url, {
        params,
        timeout: 30000,
        responseType: 'text',
        // Try with cookie-style auth
        headers: {
          'Cookie': `key=${token}`,
        },
      })

      const xmlData = response.data
      console.log('Daily report response length:', xmlData?.length)
      console.log('Daily report response preview:', xmlData?.substring(0, 500))

      // Check if we got XML or HTML error
      if (xmlData?.includes('<data>')) {
        return this.parseDailyReportXml(xmlData)
      } else {
        return {
          success: false,
          error: 'Report did not return expected XML format',
          rawResponsePreview: xmlData?.substring(0, 1000),
        }
      }
    } catch (error: any) {
      console.error('Daily report error:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      }
    }
  }

  /**
   * Parse XML from daily report "Отчет по дням новый"
   * XML structure:
   * <data>
   *   <OpenDate.Typed>09.01.2026</OpenDate.Typed>
   *   <DishCategory>BAR</DishCategory>
   *   <DishName>Americano</DishName>
   *   <PayTypes>Cash</PayTypes>
   *   <DishDiscountSumInt>638.00</DishDiscountSumInt>  - NET amount (after discount!)
   *   <DishAmountInt>6.000</DishAmountInt>             - quantity
   * </data>
   */
  private parseDailyReportXml(xml: string): any {
    const items: any[] = []

    try {
      // Extract all <data>...</data> blocks
      const dataRegex = /<data>([\s\S]*?)<\/data>/gi
      let match

      while ((match = dataRegex.exec(xml)) !== null) {
        const dataBlock = match[1]

        // Extract individual fields
        const getField = (fieldName: string): string => {
          const regex = new RegExp(`<${fieldName}>([^<]*)</${fieldName}>`, 'i')
          const fieldMatch = dataBlock.match(regex)
          return fieldMatch ? fieldMatch[1] : ''
        }

        const date = getField('OpenDate.Typed')
        const category = getField('DishCategory')
        const dishName = getField('DishName')
        const paymentType = getField('PayTypes')
        const amount = parseFloat(getField('DishDiscountSumInt')) || 0  // NET amount after discount
        const quantity = parseFloat(getField('DishAmountInt')) || 0

        if (dishName) {
          items.push({
            date,
            category,
            dishName,
            paymentType,
            amount,      // This is NET revenue (after discount)
            quantity,
          })
        }
      }

      // Group by dish for summary
      const dishSummary = new Map<string, { category: string; quantity: number; amount: number }>()
      for (const item of items) {
        const key = item.dishName
        const existing = dishSummary.get(key) || { category: item.category, quantity: 0, amount: 0 }
        dishSummary.set(key, {
          category: item.category,
          quantity: existing.quantity + item.quantity,
          amount: existing.amount + item.amount,
        })
      }

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

      // Top items by revenue
      const topItems = Array.from(dishSummary.entries())
        .map(([dishName, data]) => ({ dishName, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)

      return {
        success: true,
        itemCount: items.length,
        summary: {
          totalAmount,
          totalQuantity,
        },
        topItems,
        // Include raw items for detailed analysis
        items: items.slice(0, 50), // First 50 for debugging
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse XML',
        rawXmlPreview: xml.substring(0, 2000)
      }
    }
  }

  /**
   * Get orders list with detailed sales data
   * This method fetches closed orders and calculates accurate totals
   */
  async getOrders(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      // Try the events/sessions endpoint for closed sales data
      const response = await axios.get(
        `${this.config.serverUrl}/resto/api/v2/events/sessions`,
        {
          params: {
            key: token,
            from: filter.dateFrom + 'T00:00:00',
            to: filter.dateTo + 'T23:59:59',
          },
          timeout: 30000,
        }
      )

      return response.data
    } catch (error: any) {
      console.log('Sessions endpoint failed, trying orders endpoint')

      // Fallback to orders endpoint
      try {
        const ordersResponse = await axios.get(
          `${this.config.serverUrl}/resto/api/orders`,
          {
            params: {
              key: token,
              dateFrom: filter.dateFrom,
              dateTo: filter.dateTo,
              status: 'CLOSED', // Only closed orders
            },
            timeout: 30000,
          }
        )

        return ordersResponse.data
      } catch (orderError: any) {
        console.error('Get orders error:', orderError.response?.data || orderError.message)
        return { error: orderError.response?.data || orderError.message }
      }
    }
  }

  /**
   * Get accurate sales data by fetching the "close session" document
   * This gives the same data as the cash register close report
   */
  async getCloseSessionData(filter: OlapReportFilter): Promise<any> {
    const token = await this.authenticate()

    try {
      // Get close session documents
      const response = await axios.get(
        `${this.config.serverUrl}/resto/api/v2/documents/getDocumentsByType`,
        {
          params: {
            key: token,
            type: 'CloseSession',
            from: filter.dateFrom,
            to: filter.dateTo,
          },
          timeout: 30000,
        }
      )

      console.log('CloseSession response:', JSON.stringify(response.data).substring(0, 500))
      return response.data
    } catch (error: any) {
      console.log('CloseSession error:', error.response?.data || error.message)
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
