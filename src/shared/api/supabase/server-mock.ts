import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

// In-Memory Mock Database for UI Testing
const MOCK_DB = {
  users: [
    { id: 'admin-id', email: 'admin@bsm.hs.kr', role: 'admin', full_name: '테스트 관리자' },
    { id: 'user-id', email: 'user@bsm.hs.kr', role: 'user', full_name: '테스트 유저' }
  ],
  items: [
    { id: 'item-1', name: '맥북 프로 14인치 (M3)', category: '노트북', min_stock: 2 },
    { id: 'item-2', name: 'LG 27인치 4K 모니터', category: '디스플레이', min_stock: 3 },
    { id: 'item-3', name: '매직 마우스 2', category: '주변기기', min_stock: 5 },
    { id: 'item-4', name: 'USB-C 허브 (7-in-1)', category: '주변기기', min_stock: 10 },
    { id: 'item-5', name: 'CAT.6 LAN 케이블 5m', category: '케이블', min_stock: 20 }
  ],
  warehouses: [
    { id: 'zone-a', name: 'A구역 (본관 창고)' },
    { id: 'zone-b', name: 'B구역 (신관 자재실)' },
    { id: 'zone-c', name: 'C구역 (실습동 소모품실)' }
  ],
  inventory: [
    { item_id: 'item-1', warehouse_id: 'zone-a', quantity: 5 },
    { item_id: 'item-2', warehouse_id: 'zone-a', quantity: 8 },
    { item_id: 'item-3', warehouse_id: 'zone-b', quantity: 15 },
    { item_id: 'item-4', warehouse_id: 'zone-b', quantity: 2 },
    { item_id: 'item-5', warehouse_id: 'zone-c', quantity: 50 }
  ],
  transactions: [
    { id: 'tx-1', item_id: 'item-1', user_id: 'admin-id', quantity: 1, type: 'IN', reason: '신규 장비 입고', created_at: new Date().toISOString() },
    { id: 'tx-2', item_id: 'item-4', user_id: 'user-id', quantity: 2, type: 'OUT', reason: '동아리 활동 대여', created_at: new Date().toISOString() }
  ]
}

export async function createClient() {
  const cookieStore = await cookies()
  const role = cookieStore.get('mock_role')?.value

  // Determine authorized mock user
  const user = role === 'admin' ? MOCK_DB.users[0] : 
               role === 'user' ? MOCK_DB.users[1] : null

  // A very lightweight query builder mock
  const mockQueryBuilder = (table: string) => {
    let data = (MOCK_DB as any)[table] || []
    
    if (table === 'transactions') {
      data = data.map((t: any) => ({
        ...t,
        items: MOCK_DB.items.find((i: any) => i.id === t.item_id),
        users: MOCK_DB.users.find((u: any) => u.id === t.user_id),
      }))
    }

    if (table === 'inventory_view') {
      data = MOCK_DB.inventory.map((inv: any) => {
        const item = MOCK_DB.items.find((i: any) => i.id === inv.item_id)
        const wh = MOCK_DB.warehouses.find((w: any) => w.id === inv.warehouse_id)
        return {
          ...inv,
          item_name: item?.name,
          item_category: item?.category,
          item_min: item?.min_stock,
          warehouse_name: wh?.name
        }
      })
    }

    const state = {
      eq: (key: string, val: any) => {
        data = data.filter((d: any) => d[key] === val)
        return state
      },
      order: () => state,
      limit: () => state,
      or: () => state,
      ilike: () => state,
      csv: () => state,
      single: () => Promise.resolve({ data: data[0], error: null }),
      then: (resolve: any) => resolve({ data, error: null, count: data.length })
    }

    return {
      select: (cols: string, opts?: any) => {
        if (opts?.count) return state
        return state
      },
      insert: (newRecords: any) => {
        const records = Array.isArray(newRecords) ? newRecords : [newRecords]
        const created: any[] = []
        records.forEach(r => {
          const newRecord = { ...r, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() }
          ;(MOCK_DB as any)[table].push(newRecord)
          created.push(newRecord)
        })
        
        const insertState = {
          select: () => ({
            single: () => Promise.resolve({ data: created[0], error: null }),
            then: (resolve: any) => resolve({ data: created, error: null })
          }),
          then: (resolve: any) => resolve({ data: created, error: null })
        }
        return insertState as any
      },
      delete: () => ({ 
        eq: (key: string, val: any) => {
          (MOCK_DB as any)[table] = (MOCK_DB as any)[table].filter((d: any) => d[key] !== val)
          return Promise.resolve({ error: null })
        }
      }),
      upsert: (record: any) => {
        const tableData = (MOCK_DB as any)[table]
        const idx = tableData.findIndex((d: any) => d.item_id === record.item_id && d.warehouse_id === record.warehouse_id)
        if (idx >= 0) {
          tableData[idx] = { ...tableData[idx], ...record }
        } else {
          tableData.push(record)
        }
        return Promise.resolve({ error: null })
      }
    }
  }

  return {
    auth: {
      getUser: async () => ({ data: { user: user ? { id: user.id } : null }, error: null }),
      signInWithPassword: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => ({ error: null })
    },
    from: mockQueryBuilder,
    storage: {
      from: (bucket: string) => ({
        upload: async (pathName: string, file: any) => {
          try {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket)
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true })
            }

            const filePath = path.join(uploadDir, path.basename(pathName))
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            fs.writeFileSync(filePath, buffer)
            return { data: { path: pathName }, error: null }
          } catch (err: any) {
            console.error('Mock Upload Error:', err)
            return { data: null, error: err }
          }
        },
        getPublicUrl: (pathName: string) => {
          const publicPath = `/uploads/${bucket}/${path.basename(pathName)}`
          return { data: { publicUrl: publicPath } }
        }
      })
    },
    rpc: async (fn: string, params: any) => {
      if (fn === 'process_transfer') {
        const { p_item_id, p_from_warehouse_id, p_to_warehouse_id, p_quantity, p_user_id, p_reason } = params
        
        // 1. Subtract
        const fromInv = MOCK_DB.inventory.find(i => i.item_id === p_item_id && i.warehouse_id === p_from_warehouse_id)
        if (fromInv) fromInv.quantity -= p_quantity

        // 2. Add
        let toInv = MOCK_DB.inventory.find(i => i.item_id === p_item_id && i.warehouse_id === p_to_warehouse_id)
        if (toInv) {
          toInv.quantity += p_quantity
        } else {
          MOCK_DB.inventory.push({ item_id: p_item_id, warehouse_id: p_to_warehouse_id, quantity: p_quantity })
        }

        // 3. Log
        MOCK_DB.transactions.push({
          id: Math.random().toString(36).substr(2, 9),
          item_id: p_item_id,
          user_id: p_user_id,
          quantity: p_quantity,
          type: 'TRANSFER',
          reason: p_reason,
          created_at: new Date().toISOString()
        } as any)
      }
      return { error: null }
    }
  } as any
}
