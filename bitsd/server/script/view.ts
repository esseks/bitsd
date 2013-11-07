/// <reference path="helpers/zepto.d.ts" />
/// <reference path="helpers/Chart.d.ts" />

import model = require("model");
import debug = require("debug");

export class BrowserEventListener implements model.IEventListener {
    private $temperature  = $("#temp");
    private $temperatureValue = this.$temperature.find(".value");
    private $temperatureTrend = this.$temperature.find(".trend");
    private $status = $("#sede");
    private $statusValue = this.$status.find(".value");
    private $statusTimestamp = this.$status.find(".timestamp");
    private $statusModifiedBy = this.$status.find(".modified_by");
    private $message = $("#last.msg");
    private $messageUser = this.$message.find(".user");
    private $messageTimestamp = this.$message.find(".timestamp");
    private $messageValue = this.$message.find(".value");
    private $chart = $("#temperature_graph");

    private trend = new Trend();
    private chart = new TemperatureChart(this.$chart);
    private temperatures: model.ITemperatureEvent[] = null;

    temperature(te: model.ITemperatureEvent) {
        this.trend.add(te.temperature);

        this.$temperature.show();

        this.$temperatureValue.text(te.temperature.toString());
        this.$temperatureTrend.text(this.trend.toString());

        if (this.temperatures !== null) {
            this.temperatures.shift();
            this.temperatures.unshift(te);
            this.chart.render(this.temperatures);
        }
    }

    temperatureHistory(temps:model.ITemperatureEvent[]) {
        this.$chart.show();
        this.temperatures = temps;
        this.chart.render(this.temperatures);
    }

    message(msg:model.IMessageEvent) {
        this.$message.show();
        this.$messageUser.text(msg.from.name);
        this.$messageValue.text(msg.content);
        this.$messageTimestamp.text(msg.when.toDateString());
    }

    status(s:model.IStatusEvent) {
        this.$status.show();
        this.$statusValue.text(model.Status[s.status]);
        this.$statusModifiedBy.text(s.from.name);
        this.$statusTimestamp.text(s.when.toDateString());
    }

    static create(): model.IEventListener {
        return new BrowserEventListener();
    }
}

class TemperatureChart {
    ctx: any;

    constructor(elem: ZeptoCollection) {
        var canvas = <HTMLCanvasElement>elem.get()[0];
        this.ctx = canvas.getContext("2d");
    }

    render(tss: model.ITemperatureEvent[]) {
        var data = {
            labels: this.labels(tss, 7),
            datasets: [this.dataset(tss)]
        };

        new Chart(this.ctx).Line(data)
    }

    private labels(tss: model.ITemperatureEvent[], num: number): string[] {
        var l: string[] = [],
            interval = tss.length / num,
            offset = (tss.length % num) / 2;

        for (var i = 0; i < num; i++) {
            var date = tss[i * interval + offset].when;

            l.push(date.getHours().toString() + ":" + date.getMinutes().toString());
        }

        return l;
    }

    private dataset(tss: model.ITemperatureEvent[]): LineDataset {
        var d: number[] = [];
        for (var i = 0, len = tss.length; i < len; i++) {
            d.push(tss[i].temperature);
        }

        return {data: d};
    }
}

class Trend {
    diff: number = 0;
    oldValue: number = 0;

    add(value) {
        this.diff = value - this.oldValue;
        debug.logger.log("The difference between the current temp and the old temp is", this.diff);
    }

    toString() {
        if (this.diff === 0) {
            return "→";
        } else if (this.diff > 0) {
            return "↗";
        } else {
            return "↘";
        }
    }
}