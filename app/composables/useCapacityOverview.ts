import { buildDashboard } from '~/utils/capacity'
import type { CapacityOverview } from '~~/shared/types/capacity'

export function useCapacityOverview() {
  const route = useRoute()
  const router = useRouter()

  const month = computed(() => {
    const value = route.query.month
    return typeof value === 'string' ? value : undefined
  })

  const { data, pending, error, refresh } = useFetch<CapacityOverview>(
    'https://capacity.workshape.dev/api/v1/capacity-overview',
    {
      query: computed(() => (month.value ? { month: month.value } : {})),
      server: false,
      retry: 2,
      retryDelay: 500,
      retryStatusCodes: [500, 502, 503, 504],
    },
  )

  const mounted = ref(false)
  const isLoading = computed(() => !mounted.value || pending.value)

  onMounted(() => {
    mounted.value = true
  })

  const lastSuccessfulData = shallowRef<CapacityOverview | null>(null)

  watch(
    data,
    (value) => {
      if (value) lastSuccessfulData.value = value
    },
    { immediate: true },
  )

  const dashboard = computed(() =>
    lastSuccessfulData.value ? buildDashboard(lastSuccessfulData.value) : null,
  )

  const selectedMonth = computed(() => {
    if (month.value && dashboard.value?.availableMonths.includes(month.value))
      return month.value
    return dashboard.value?.month ?? month.value ?? ''
  })

  const errorStatus = computed(() => error.value?.statusCode)

  const errorMessage = computed(() => {
    if (errorStatus.value === 422)
      return 'That month is not available. Use the current reporting month.'
    if (errorStatus.value && errorStatus.value >= 500)
      return 'The capacity service is temporarily unavailable. Try again.'
    return 'Could not load capacity data. Check your connection and try again.'
  })

  function setMonth(value: string) {
    router.replace({ query: { month: value } })
  }

  function useCurrentMonth() {
    router.replace({ query: {} })
  }

  return {
    dashboard,
    error,
    errorMessage,
    errorStatus,
    isLoading,
    month,
    refresh,
    selectedMonth,
    setMonth,
    useCurrentMonth,
  }
}
