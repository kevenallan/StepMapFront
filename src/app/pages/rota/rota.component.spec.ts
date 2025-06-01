/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RotaComponent } from './rota.component';

describe('RotaComponent', () => {
  let component: RotaComponent;
  let fixture: ComponentFixture<RotaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RotaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RotaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
