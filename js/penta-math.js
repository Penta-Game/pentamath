import { Point, Figure } from "./core.js";

export class PentaMath {
  /*
    This class provides an appropriate representation of the sizes and values for the construction of a pentagame board.
    The basic logic was supplied by @penta-jan <https://github.com/penta-jan>.
    The implementation was written by @cobalt <https://cobalt.rocks>
    Enhanced variant based on <https://github.com/Penta-Game/boardgame>
    Inspired by <https://github.com/NikkyAI/pentagame>

    To learn more about pentagame visit https://pentagame.org
    */

  // holds the numerical constants
  _constants = {
    l: 6, // legs
    k: 3, // arms
    p: Math.sqrt((25 - 11 * Math.sqrt(5)) / (5 - Math.sqrt(5))), // inner
    golden: (Math.sqrt(5) + 1) / 2, // golden section value
    theta: 18, // theta value
  };

  // holds the relative numerical relative values centered on s
  _sizes = {
    s: 1, // stop on star
    c: Math.sqrt(5), // corner stop
    j: (9 - 2 * Math.sqrt(5)) / Math.sqrt(5), // junction stop
    r: (2 / 5) * Math.sqrt(1570 + 698 * Math.sqrt(5)), // pentagram (diameter)
  };

  constructor(drawer) {
    this._sizes.R = this._sizes.r + this._sizes.c; // entire board
    this._sizes.outer_circle = (this._sizes.r / this._sizes.R) * 0.2; // background stroke width
    this._sizes.inner_r =
      ((this._constants.k + this._sizes.j) * (1.0 + this._sizes.c)) /
      Math.sqrt(2.0 * (5.0 + this._sizes.c));
    this._constants.sizes = this._sizes;
    this.constants = this._constants;
    this.drawer = drawer;
  }

  helper(centerX, centerY, radius, angle, options) {
    if (options !== undefined && "shift" in options && options.shift === true) {
      angle = (angle * Math.PI) / 180 + (Math.PI / 180.0) * -18;
    } else {
      angle = (angle * Math.PI) / 180;
    }

    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  }

  interpretGraphData(data) {
    console.log(data);
    for (let i = data.figures.length; i != -1; i--) {
      let figure = data.figures[i];
      if (figure.position[0] > figure.position[2]) {
        let position = [
          figure.position[2],
          figure.position[1],
          figure.position[0]
        ];
      }
      this.drawFigure();
    }
  }

  drawFigure(id, FigureId, data) {
    let element = document.getElementById(id);
    const lineWidth = (0.1 / this.constants.sizes.R) * scale;
    if (element !== undefined) {
      let figure = new Figure({
        type: data["type"],
        shape: data["shape"],
        color: data["color"],
        id: FigureId,
      });
      element = new SVGCircleElement(element);
      figure.node = this.drawer[data["shape"]](element[data["size"]]);
      figure.node.attr({
        cx: element.cx,
        cy: element.cy,
        fill: color,
        "stroke-width": lineWidth,
        stroke: "#d3d3d3",
      });
      return figure;
    } else {
      throw ReferenceError("Id was not found in DOM");
    }
  }

  draw(scale, args) {
    // evaluate args
    if (args === undefined || args.colors === undefined) {
      var colors = {
        fields: ["blue", "white", "green", "yellow", "red"],
        background: "#28292b",
        foreground: "#d3d3d3",
      };
    } else {
      var colors = args.colors;
    }

    if (args !== undefined && args.shift !== undefined) {
      this.shift = { shift: true };
    } else {
      this.shift = { shift: false };
    }

    // setup board
    var board = {
      corners: {},
      junctions: {},
      stops: {
        outer: {},
        inner: {},
      },
    };

    // fix this.drawer aspect ratio
    this.drawer.attr({ preserveAspectRatio: "xMidYMid meet" });

    // evaluate basic points and values
    const center = { x: 0.5 * scale, y: 0.5 * scale };
    scale = scale * 0.8; // prevent overflow
    const lineWidth = (0.1 / this.constants.sizes.R) * scale;
    const InnerRadius =
      (scale / this.constants.sizes.R) * this.constants.sizes.inner_r;
    const OuterRadius = scale / this.constants.sizes.c + lineWidth * 3.5;
    const JunctionRadius =
      (scale / this.constants.sizes.R) * this.constants.sizes.j;
    const CornerRadius =
      (scale / this.constants.sizes.R) * this.constants.sizes.c;
    const StopRadius =
      (scale / this.constants.sizes.R) * this.constants.sizes.s;

    // bg circle
    const BGCircle = this.drawer.circle(scale + lineWidth * 5);
    BGCircle.attr({
      cx: center.x,
      cy: center.y,
      fill: colors.background,
      id: "background-circle",
    });


    // draw outer circle
    const OuterBGCircle = this.drawer.circle(OuterRadius * 2);
    OuterBGCircle.attr({
      cx: center.x,
      cy: center.y,
      fill: "none",
      stroke: colors.foreground,
      "stroke-width": lineWidth,
    });
    OuterBGCircle.data({ id: "outer-circle" });


    // drawing corners and junctions
    for (var i = 5; i !== -1; i--) {
      let CornerAngle = i * -72;
      let CornerPoints = this.helper(
        center.x,
        center.y,
        OuterRadius,
        CornerAngle,
        this.shift
      );
      let JunctionAngle = CornerAngle + 180;
      let JunctionPoints = this.helper(
        center.x,
        center.y,
        InnerRadius,
        JunctionAngle,
        this.shift
      );

      // draw stops before Junctions to prevent overlapping
      for (let x = 1; x !== 4; x++) {
        console.log(i);
        let StopAngle = CornerAngle + this.constants.theta * x;
        let StopPoints = this.helper(
          center.x,
          center.y,
          OuterRadius,
          StopAngle,
          this.shift
        );
        let OuterStop = this.drawer.circle(StopRadius);
        OuterStop.attr({
          fill: colors.foreground,
          stroke: colors.background,
          "stroke-width": lineWidth * 0.5,
        });
        OuterStop.center(StopPoints.x, StopPoints.y);
        OuterStop.data({ id: `s-${i}-${x}` });

        board.stops.outer[`s-${i}-${x}`] = {
          x: StopPoints.x,
          y: StopPoints.y,
          angle: StopAngle,
          node: OuterStop.node,
        };
        let ArmAngle = JunctionAngle - this.constants.theta * 7;
        let ArmPoints = this.helper(
          JunctionPoints.x,
          JunctionPoints.y,
          StopRadius * x + JunctionRadius / 4,
          ArmAngle,
          this.shift
        );
        let ArmStop = this.drawer.circle(StopRadius);
        ArmStop.attr({
          fill: colors.foreground,
          stroke: colors.background,
          "stroke-width": lineWidth * 0.5
        });
        ArmStop.center(ArmPoints.x, ArmPoints.y);
        ArmStop.data({ id: `s-${i + 2}-${x}-${i + 1}` });

        board.stops.inner[`s-${i + 1}-${x}`] = {
          x: ArmPoints.x,
          y: ArmPoints.y,
          angle: ArmAngle,
          node: ArmStop.node,
        };
      }

      // draw legs
      for (let x = 6; x !== 0; x--) {
        const LegAngles = [
          this.constants.theta + 180 + CornerAngle,
          this.constants.theta * -1 + 180 + CornerAngle,
        ];
        for (const index in LegAngles) {
          var Leg = this.drawer.circle(StopRadius);
          let LegPoints = this.helper(
            CornerPoints.x,
            CornerPoints.y,
            StopRadius * x + CornerRadius / 4 + lineWidth * 1.5,
            LegAngles[index],
            this.shift
          );
          Leg.attr({
            fill: colors.foreground,
            stroke: colors.background,
            "stroke-width": lineWidth * 0.5,
          });

          Leg.center(LegPoints.x, LegPoints.y);
          Leg.data({ id: `s-${i + 6}-${x}-${i + 4}` });
          board.stops.inner[`s-${i}-${x}-${i + 5 + x}`] = {
            x: LegPoints.x,
            y: LegPoints.y,
            angle: LegAngles[index],
          };
        }
      }

      // draw Corners and Junctions
      let Corner = this.drawer.circle(CornerRadius);
      Corner.attr({
        fill: colors.foreground,
        stroke: colors.fields[i],
        "stroke-width": 0.75 * lineWidth,
      });
      Corner.center(CornerPoints.x, CornerPoints.y);
      Corner.data({ id: i + 6 });

      var Junction = this.drawer.circle(JunctionRadius);
      Junction.attr({
        fill: colors.foreground,
        stroke: colors.fields[i],
        "stroke-width": 0.75 * lineWidth,
      });
      Junction.center(JunctionPoints.x, JunctionPoints.y);
      Junction.data({ id: i + 1 });

      board.corners[i] = new Point({
        id: i + 7,
        x: CornerPoints.x,
        y: CornerPoints.y,
        next: i + 8,
        node: Corner.node,
        angle: CornerAngle,
        color: colors[i],
      });
      board.junctions[i] = new Point({
        id: i + 1,
        x: JunctionPoints.x,
        y: JunctionPoints.y,
        next: i + 2,
        node: Junction.node,
        angle: JunctionAngle,
        color: colors[i],
      });
    }

    this.board = board;
    return {
      board: board,
    };
  }
}

export default { PentaMath };