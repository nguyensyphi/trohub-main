/* eslint-disable no-unsafe-optional-chaining */
import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js"
import { Line, Pie } from "react-chartjs-2"
import { apiGetDashboard } from "@/apis/user"
import {
  cn,
  getDaysInMonth,
  getDaysInRange,
  getMonthInYear,
  getMonthsInRange,
  shortNumber,
} from "@/lib/utils"
import Section from "@/components/Section"
import { EyeIcon, List, User2, Wallet } from "lucide-react"
ChartJS.register(ArcElement, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale)
const AdminGeneral = () => {
  const [data, setData] = useState(null)
  const [isMonth, setIsMonth] = useState(false)
  const [customTime, setCustomTime] = useState({
    from: "",
    to: "",
  })
  const [chartData, setChartData] = useState([])
  const fetchDashboard = async (params) => {
    const response = await apiGetDashboard(params)
    if (response.data.success) setData(response.data.data)
  }
  useEffect(() => {
    const type = isMonth ? "month" : "day"
    const params = { type }
    if (customTime.from) params.from = customTime.from
    if (customTime.to) params.to = customTime.to
    fetchDashboard(params)
  }, [isMonth, customTime])

  useEffect(() => {
    const number = isMonth
      ? getMonthsInRange(customTime?.from, customTime?.to)
      : getDaysInRange(customTime?.from, customTime?.to)
    const daysInMonth = getDaysInMonth(customTime?.to, number)
    const monthsInYear = getMonthInYear(customTime?.to, number)
    const rawData = isMonth ? monthsInYear : daysInMonth
    const editedData = rawData.map((el) => {
      return {
        createdPost: data?.posts?.some((i) => i.date === el)
          ? data?.posts.find((i) => i.date === el)?.createdPost
          : 0,
        date: el,
      }
    })
    setChartData(editedData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.posts])

  const options = {
    responsive: true,
    pointRadius: 0,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { display: true },
        grid: { color: "rgba(0,0,0,0.1)", drawTicks: false },
        min:
          Math.min(...chartData?.map((el) => +el.createdPost)) - 5 < 0
            ? 0
            : Math.min(...chartData?.map((el) => +el.createdPost)) - 5,
        max: Math.max(...chartData?.map((el) => +el.createdPost)) + 5,
        border: { dash: [20, 0] },
      },
      x: {
        ticks: { color: "black" },
        grid: { color: "transparent" },
      },
    },
    plugins: {
      legend: false,
    },
    hover: {
      mode: "dataset",
      intersect: false,
    },
  }

  const handleCustomTime = () => {
    setCustomTime({ from: "", to: "" })
  }
  const pieData = {
    labels: ["Người chưa đăng ký", "Người đã đăng ký"],
    datasets: [
      {
        label: "Lượt truy cập",
        data: [data?.anonymous, data?.registed],
        backgroundColor: ["rgba(255, 99, 132, 0.2)", "rgba(54, 162, 235, 0.2)"],
        borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
        borderWidth: 1,
      },
    ],
  }
  return (
    <section className={cn("space-y-4 p-4")}>
      <Section title="Tổng quan">
        <div className="py-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary p-4 border border-primary/20 rounded-xl flex items-center justify-between gap-2 shadow-sm overflow-hidden">
              <span className="text-2xl lg:text-3xl font-bold text-slate-50 truncate" title={data?.createdUser}>
                {data?.createdUser}
              </span>
              <span className="flex text-white flex-col gap-1 items-end shrink-0">
                <span>
                  <User2 className="text-white" size={20} />
                </span>
                <span className="text-sm whitespace-nowrap">Thành viên mới</span>
              </span>
            </div>
            <div className="bg-chart-5/90 p-4 border border-border rounded-xl flex items-center justify-between gap-2 shadow-sm overflow-hidden">
              <span className="text-2xl lg:text-3xl font-bold text-slate-50 truncate" title={shortNumber(+data?.totalIncomes)}>
                {shortNumber(+data?.totalIncomes)}
              </span>
              <span className="flex text-white flex-col gap-1 items-end shrink-0">
                <span>
                  <Wallet size={20} />
                </span>
                <span className="text-sm whitespace-nowrap">Thu nhập</span>
              </span>
            </div>
            <div className="bg-chart-1 p-4 border border-border rounded-xl flex items-center justify-between gap-2 shadow-sm overflow-hidden">
              <span className="text-2xl lg:text-3xl font-bold text-slate-50 truncate">
                {data?.posts?.reduce((sum, el) => sum + Number(el.createdPost), 0)}
              </span>
              <span className="flex text-slate-50 flex-col gap-1 items-end shrink-0">
                <span>
                  <List size={20} />
                </span>
                <span className="text-sm whitespace-nowrap">Bài đăng mới</span>
              </span>
            </div>
            <div className="bg-chart-4 p-4 border border-border rounded-xl flex items-center justify-between gap-2 shadow-sm text-slate-900 overflow-hidden">
              <span className="text-2xl lg:text-3xl font-bold truncate">
                {data?.anonymous + data?.registed}
              </span>
              <span className="flex flex-col gap-1 items-end opacity-90 shrink-0">
                <span>
                  <EyeIcon size={20} />
                </span>
                <span className="text-sm whitespace-nowrap">Lượt truy cập</span>
              </span>
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-7 h-fit border border-border flex flex-col gap-4 relative rounded-xl p-4 bg-card shadow-sm overflow-hidden auto-cols-min">
            <span className="font-bold">{`Tin đăng mới theo ${isMonth ? "tháng" : "ngày"}`}</span>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-2">
                  <label htmlFor="from" className="text-sm font-medium whitespace-nowrap">Từ</label>
                  <input
                    type="date"
                    value={customTime.from}
                    onChange={(e) => setCustomTime((prev) => ({ ...prev, from: e.target.value }))}
                    id="from"
                    className="text-sm border p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </span>
                <span className="flex items-center gap-2">
                  <label htmlFor="to" className="text-sm font-medium whitespace-nowrap">Đến</label>
                  <input
                    type="date"
                    value={customTime.to}
                    onChange={(e) => setCustomTime((prev) => ({ ...prev, to: e.target.value }))}
                    id="to"
                    className="text-sm border p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </span>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded-md border border-primary text-primary whitespace-nowrap hover:bg-primary/5"
                  onClick={handleCustomTime}
                >
                  Xóa lọc
                </button>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm border rounded-l-md ${
                    isMonth ? "bg-card text-foreground" : "text-white font-semibold bg-primary"
                  }`}
                  onClick={() => setIsMonth(false)}
                >
                  Ngày
                </button>
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm border border-l-0 rounded-r-md ${
                    isMonth ? "text-white font-semibold bg-primary" : "bg-card text-foreground"
                  }`}
                  onClick={() => setIsMonth(true)}
                >
                  Tháng
                </button>
              </div>
            </div>
            {chartData ? (
              <div className="chart-container overflow-x-auto w-full">
                <div className="min-w-[500px]">
                  <Line
                    options={options}
                    data={{
                      labels: chartData?.map((el) => el.date),
                      datasets: [
                        {
                          data: chartData?.map((el) => +el.createdPost),
                          borderColor: "#e35050",
                          tension: 0.2,
                          borderWidth: 2,
                          pointBackgroundColor: "white",
                          pointHoverRadius: 4,
                          pointBorderColor: "#e35050",
                          pointHoverBorderWidth: 4,
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            ) : (
              <span className="text-sm text-foreground/70">Không có tin đăng nào.</span>
            )}
          </div>
          <div className="lg:col-span-3 rounded-xl border p-4 bg-card shadow-sm flex flex-col justify-center items-center">
            <span className="font-bold text-center mb-4 leading-tight">Thống kê lượt truy cập</span>
            <div className="w-[80%] max-w-[250px]">
              <Pie data={pieData} />
            </div>
          </div>
        </div>
      </Section>
    </section>
  )
}

export default AdminGeneral
