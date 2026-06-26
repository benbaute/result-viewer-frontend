
import { Component, signal, model, ViewEncapsulation, effect, input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Popover } from 'primeng/popover';
import { Divider } from 'primeng/divider';
import { Select, SelectLazyLoadEvent, SelectFilterEvent } from 'primeng/select';
import {
	SettingGroup,
	SettingsDrawerComponent,
	IdListRequest,
	PagedIds
} from '@simra/intersections-common';
import { IntersectionsRequestService } from '@simra/intersections-domain';


@Component({
	selector: 'intersection-map-settings',
	imports: [FormsModule, Button, Card, Divider, Popover, Select, SettingsDrawerComponent],
	templateUrl: './map-settings.html',
	styleUrl: './map-settings.scss',
	encapsulation: ViewEncapsulation.None
})
export class MapSettingsComponent {
	screenshotMode = model.required<boolean>();
	fullscreenMode = model.required<boolean>();

	sidebarVisible = signal<boolean>(false);
	settings = input.required<SettingGroup[]>();

	extendedSettings = input.required<boolean>();
	selectedRideId = model<number | null>();

	selectableRideIds = signal<{id: number, label: string}[]>([]);
	loadingRideIds = signal(false);

	protected readonly rideIdsRequest = signal<IdListRequest>({
		size: 100,
		page: 0
	});

	protected readonly pagedResponse = signal<PagedIds | null>(null);

	private _requestService = inject(IntersectionsRequestService);

	constructor() {
		effect(async () => {
			if (!this.extendedSettings()) return;
			const request = this.rideIdsRequest();
			const currentSelected = this.selectedRideId();

			this.loadingRideIds.set(true);

			const response = await this._requestService.getIds({
				...request,
				id: request.id || currentSelected || undefined
			});
			const newItems = response.ids.map(id => ({ id, label: `${id}` }));
			
			if (request.page === 0) {
				this.selectableRideIds.set(newItems);
			} else {
				this.selectableRideIds.update(current => [...current, ...newItems]);
			}

			this.pagedResponse.set(response);
			this.loadingRideIds.set(false);
		})
	}

	async loadRides(event: SelectLazyLoadEvent) {
		const request = this.rideIdsRequest();
		const response = this.pagedResponse();
		if (!response) return;

		const pageSize = request.size;
	    const targetPage = Math.floor(event.last / pageSize);

		if (targetPage > request.page && targetPage < response.metadata.totalPages) {
			this.rideIdsRequest.update(current => ({
				...current,
				page: targetPage
			}));
		}
	}

	filterRides(event: SelectFilterEvent) {
		const filter = Number(event.filter);
		this.rideIdsRequest.update(current => ({
			...current,
			page: 0,
			id: filter
		}))
	}
}
