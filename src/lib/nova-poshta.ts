
const PROXY_URL = '/api/nova-poshta';

export async function searchSettlements(query: string): Promise<any[]> {
  if (query.length < 2) return [];

  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: 'Address',
        calledMethod: 'searchSettlements',
        methodProperties: {
          CityName: query,
          Limit: '20'
        }
      })
    });

    const data = await response.json();
    if (data.success && data.data && data.data.length > 0) {
      return data.data[0].Addresses || [];
    }
    return [];
  } catch (error) {
    console.error('Nova Poshta searchSettlements error:', error);
    return [];
  }
}

export async function getWarehouses(cityRef: string, query: string = ''): Promise<any[]> {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: 'Address',
        calledMethod: 'getWarehouses',
        methodProperties: {
          CityRef: cityRef,
          FindByString: query,
          Limit: '100'
        }
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Nova Poshta getWarehouses error:', error);
    return [];
  }
}
