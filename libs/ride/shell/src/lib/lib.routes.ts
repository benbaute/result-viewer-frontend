import { Route } from '@angular/router';
export const RIDE_SHELL_ROUTES: Route[] = [
	{
		path: '',
		children: [
			{
				path: '',
				pathMatch: 'full',
				loadComponent: () =>
					import('@simra/ride-map').then((m) => m.RideMapPage),
			},
			{
				path: '**',
				redirectTo: '',
			}
		]
	}
];