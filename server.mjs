import Koa from "koa";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import Redis from "ioredis";
import { performance } from "node:perf_hooks";

dotenv.config();

const PORT = process.env.PORT ?? 8000;
const app = new Koa();

app.use(async (ctx) => {
	const client = new Redis(process.env.REDIS_URL);
	const connection = await mysql.createConnection(process.env.DATABASE_URL);

	const uud =
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15);

	const setR = [];
	console.log("set...");
	for (let i = 0; i < 100; i++) {
		performance.mark("set-start");
		await client.set("foo", uud);
		performance.mark("set-end");
		setR.push(performance.measure("set", "set-start", "set-end").duration);
		performance.clearMarks();
	}
	const readR = [];
	console.log("read...");
	for (let i = 0; i < 100; i++) {
		performance.mark("read-start");
		await client.get("foo");
		performance.mark("read-end");
		readR.push(performance.measure("read", "read-start", "read-end").duration);
		performance.clearMarks();
	}

	const selectR = [];
	console.log("select...");
	for (let i = 0; i < 100; i++) {
		performance.mark("select-start");
		await connection.execute("SELECT * FROM products");
		performance.mark("select-end");
		selectR.push(
			performance.measure("select", "select-start", "select-end").duration,
		);
		performance.clearMarks();
	}

	await connection.end();
	client.disconnect();

	ctx.type = "application/json";
	ctx.body = {
		select: Math.min(...selectR),
		set: Math.min(...setR),
		read: Math.min(...readR),
	};
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);
