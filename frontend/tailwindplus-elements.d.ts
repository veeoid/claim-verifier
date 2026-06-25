import { HTMLAttributes } from "react";

declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"el-popover-group": HTMLAttributes<HTMLElement> & { [key: string]: any };
			"el-popover": HTMLAttributes<HTMLElement> & { [key: string]: any };
			"el-dialog": HTMLAttributes<HTMLElement> & { [key: string]: any };
			"el-dialog-panel": HTMLAttributes<HTMLElement> & { [key: string]: any };
			"el-disclosure": HTMLAttributes<HTMLElement> & { [key: string]: any };
		}
	}

	interface ButtonHTMLAttributes<T> {
		command?: string;
		commandfor?: string;
		popovertarget?: string;
		popoverTarget?: string;
	}
}
