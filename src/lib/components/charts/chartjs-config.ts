import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	RadialLinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	DoughnutController,
	PieController,
	RadarController,
	ScatterController
} from 'chart.js';

// Register Chart.js components globally
ChartJS.register(
	CategoryScale,
	LinearScale,
	RadialLinearScale,
	PointElement,
	LineElement,
	BarElement,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	LineController,
	BarController,
	DoughnutController,
	PieController,
	RadarController,
	ScatterController
);

export { ChartJS };
